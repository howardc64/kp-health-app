/**
 * Kaiser Permanente FHIR API Client - JavaScript/React
 * 
 * This implementation provides access to Kaiser Permanente's patient-facing
 * FHIR API using JavaScript/React with SMART on FHIR OAuth flow.
 */

// Kaiser Permanente API Configuration
const KP_CONFIG = {
    fhirBaseUrl: 'https://api.kp.org/fhir',
    authorizationEndpoint: 'https://api.kp.org/oauth2/authorize',
    tokenEndpoint: 'https://api.kp.org/oauth2/token',
    scopes: [
        'patient/Patient.read',
        'patient/AllergyIntolerance.read',
        'patient/CarePlan.read',
        'patient/Condition.read',
        'patient/Device.read',
        'patient/DiagnosticReport.read',
        'patient/DocumentReference.read',
        'patient/Goal.read',
        'patient/Immunization.read',
        'patient/MedicationRequest.read',
        'patient/Observation.read',
        'patient/Procedure.read',
        'openid',
        'fhirUser'
    ].join(' ')
};

/**
 * Generate PKCE code verifier and challenge
 */
function generatePKCE() {
    // Generate random code verifier
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const codeVerifier = btoa(String.fromCharCode.apply(null, array))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    
    // Generate code challenge (SHA-256 hash of verifier)
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier))
        .then(buffer => {
            const codeChallenge = btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)))
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=/g, '');
            
            return { codeVerifier, codeChallenge };
        });
}

/**
 * Generate random state for CSRF protection
 */
function generateState() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, array))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

/**
 * Kaiser Permanente FHIR Client Class
 */
class KaiserPermanenteFHIRClient {
    constructor(clientId, redirectUri) {
        this.clientId = clientId;
        this.redirectUri = redirectUri;
        this.accessToken = null;
        this.refreshToken = null;
        this.patientId = null;
        this.codeVerifier = null;
    }
    
    /**
     * Initiate OAuth authorization flow
     */
    async authorize() {
        const state = generateState();
        const { codeVerifier, codeChallenge } = await generatePKCE();
        
        // Store code verifier and state in session storage
        sessionStorage.setItem('code_verifier', codeVerifier);
        sessionStorage.setItem('oauth_state', state);
        
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            scope: KP_CONFIG.scopes,
            state: state,
            aud: KP_CONFIG.fhirBaseUrl,
            code_challenge: codeChallenge,
            code_challenge_method: 'S256'
        });
        
        // Redirect to Kaiser Permanente authorization page
        window.location.href = `${KP_CONFIG.authorizationEndpoint}?${params.toString()}`;
    }
    
    /**
     * Handle OAuth callback and exchange code for token
     */
    async handleCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const storedState = sessionStorage.getItem('oauth_state');
        const codeVerifier = sessionStorage.getItem('code_verifier');
        
        // Verify state to prevent CSRF
        if (state !== storedState) {
            throw new Error('State mismatch - possible CSRF attack');
        }
        
        if (!code) {
            const error = urlParams.get('error');
            const errorDesc = urlParams.get('error_description');
            throw new Error(`Authorization failed: ${error} - ${errorDesc}`);
        }
        
        // Exchange authorization code for access token
        const tokenData = {
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: this.redirectUri,
            client_id: this.clientId,
            code_verifier: codeVerifier
        };
        
        const response = await fetch(KP_CONFIG.tokenEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams(tokenData)
        });
        
        if (!response.ok) {
            throw new Error(`Token exchange failed: ${response.statusText}`);
        }
        
        const tokenResponse = await response.json();
        
        this.accessToken = tokenResponse.access_token;
        this.refreshToken = tokenResponse.refresh_token;
        this.patientId = tokenResponse.patient;
        
        // Store tokens securely (in production, use more secure storage)
        sessionStorage.setItem('access_token', this.accessToken);
        sessionStorage.setItem('refresh_token', this.refreshToken);
        sessionStorage.setItem('patient_id', this.patientId);
        
        // Clean up
        sessionStorage.removeItem('code_verifier');
        sessionStorage.removeItem('oauth_state');
        
        return tokenResponse;
    }
    
    /**
     * Restore session from stored tokens
     */
    restoreSession() {
        this.accessToken = sessionStorage.getItem('access_token');
        this.refreshToken = sessionStorage.getItem('refresh_token');
        this.patientId = sessionStorage.getItem('patient_id');
        
        return !!this.accessToken;
    }
    
    /**
     * Refresh access token
     */
    async refreshAccessToken() {
        if (!this.refreshToken) {
            throw new Error('No refresh token available');
        }
        
        const tokenData = {
            grant_type: 'refresh_token',
            refresh_token: this.refreshToken,
            client_id: this.clientId
        };
        
        const response = await fetch(KP_CONFIG.tokenEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams(tokenData)
        });
        
        if (!response.ok) {
            throw new Error('Token refresh failed');
        }
        
        const tokenResponse = await response.json();
        this.accessToken = tokenResponse.access_token;
        
        sessionStorage.setItem('access_token', this.accessToken);
        
        return tokenResponse;
    }
    
    /**
     * Make authenticated FHIR request
     */
    async request(endpoint, params = {}) {
        if (!this.accessToken) {
            throw new Error('No access token - please authenticate first');
        }
        
        const queryString = new URLSearchParams(params).toString();
        const url = `${KP_CONFIG.fhirBaseUrl}/${endpoint}${queryString ? '?' + queryString : ''}`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Accept': 'application/fhir+json'
            }
        });
        
        if (response.status === 401) {
            // Token expired, try to refresh
            await this.refreshAccessToken();
            // Retry request
            return this.request(endpoint, params);
        }
        
        if (!response.ok) {
            throw new Error(`FHIR request failed: ${response.statusText}`);
        }
        
        return await response.json();
    }
    
    // FHIR Resource Methods
    
    async getPatient(patientId = null) {
        const pid = patientId || this.patientId;
        return await this.request(`Patient/${pid}`);
    }
    
    async getAllergies(patientId = null) {
        const pid = patientId || this.patientId;
        return await this.request('AllergyIntolerance', { patient: pid });
    }
    
    async getConditions(patientId = null) {
        const pid = patientId || this.patientId;
        return await this.request('Condition', { patient: pid });
    }
    
    async getMedications(patientId = null, status = null) {
        const pid = patientId || this.patientId;
        const params = { patient: pid };
        if (status) params.status = status;
        return await this.request('MedicationRequest', params);
    }
    
    async getImmunizations(patientId = null) {
        const pid = patientId || this.patientId;
        return await this.request('Immunization', { patient: pid });
    }
    
    async getObservations(patientId = null, category = null) {
        const pid = patientId || this.patientId;
        const params = { patient: pid, _sort: '-date' };
        if (category) params.category = category;
        return await this.request('Observation', params);
    }
    
    async getVitalSigns(patientId = null) {
        return await this.getObservations(patientId, 'vital-signs');
    }
    
    async getLabResults(patientId = null) {
        return await this.getObservations(patientId, 'laboratory');
    }
    
    async getProcedures(patientId = null) {
        const pid = patientId || this.patientId;
        return await this.request('Procedure', { patient: pid });
    }
    
    async getDiagnosticReports(patientId = null) {
        const pid = patientId || this.patientId;
        return await this.request('DiagnosticReport', { patient: pid });
    }
    
    async getCarePlans(patientId = null) {
        const pid = patientId || this.patientId;
        return await this.request('CarePlan', { patient: pid });
    }
    
    async logout() {
        this.accessToken = null;
        this.refreshToken = null;
        this.patientId = null;
        sessionStorage.clear();
    }
}

/**
 * React Hook for Kaiser Permanente FHIR
 * Note: This requires React to be loaded in your application
 * For use with React apps that have JSX build step (Babel/Webpack)
 */
/*
function useKaiserPermanenteFHIR(clientId, redirectUri) {
    const [client] = React.useState(() => 
        new KaiserPermanenteFHIRClient(clientId, redirectUri)
    );
    const [isAuthenticated, setIsAuthenticated] = React.useState(false);
    const [patient, setPatient] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    
    React.useEffect(() => {
        // Check if we have a stored session
        if (client.restoreSession()) {
            setIsAuthenticated(true);
            client.getPatient()
                .then(setPatient)
                .catch(setError)
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [client]);
    
    const login = React.useCallback(() => {
        client.authorize();
    }, [client]);
    
    const logout = React.useCallback(() => {
        client.logout();
        setIsAuthenticated(false);
        setPatient(null);
    }, [client]);
    
    return {
        client,
        isAuthenticated,
        patient,
        loading,
        error,
        login,
        logout
    };
}
*/

/**
 * Vanilla JavaScript Example (No React Required)
 * This works directly in browsers without a build step
 */
async function initializeKaiserPermanenteApp(clientId, redirectUri) {
    const client = new KaiserPermanenteFHIRClient(clientId, redirectUri);
    
    // Check if returning from OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('code')) {
        try {
            await client.handleCallback();
            // Redirect to clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
        } catch (error) {
            console.error('OAuth callback error:', error);
            throw error;
        }
    }
    
    // Restore session if available
    const hasSession = client.restoreSession();
    
    return {
        client,
        isAuthenticated: hasSession,
        async login() {
            await client.authorize();
        },
        logout() {
            client.logout();
            window.location.reload();
        },
        async loadPatientData() {
            if (!hasSession) {
                throw new Error('Not authenticated');
            }
            
            try {
                const [patient, allergies, medications, conditions, vitals, labs] = await Promise.all([
                    client.getPatient(),
                    client.getAllergies().catch(() => ({ total: 0, entry: [] })),
                    client.getMedications('active').catch(() => ({ total: 0, entry: [] })),
                    client.getConditions().catch(() => ({ total: 0, entry: [] })),
                    client.getVitalSigns().catch(() => ({ total: 0, entry: [] })),
                    client.getLabResults().catch(() => ({ total: 0, entry: [] }))
                ]);
                
                return {
                    patient,
                    allergies,
                    medications,
                    conditions,
                    vitals,
                    labs
                };
            } catch (error) {
                console.error('Error loading patient data:', error);
                throw error;
            }
        }
    };
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        KaiserPermanenteFHIRClient,
        initializeKaiserPermanenteApp,
        KP_CONFIG
    };
}
