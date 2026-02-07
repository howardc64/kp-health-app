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
 */
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

/**
 * Example React Component
 */
function KaiserPermanenteApp() {
    const CLIENT_ID = 'your_client_id_here';
    const REDIRECT_URI = window.location.origin + '/callback';
    
    const { client, isAuthenticated, patient, loading, error, login, logout } = 
        useKaiserPermanenteFHIR(CLIENT_ID, REDIRECT_URI);
    
    const [allergies, setAllergies] = React.useState(null);
    const [medications, setMedications] = React.useState(null);
    const [conditions, setConditions] = React.useState(null);
    
    React.useEffect(() => {
        if (isAuthenticated && patient) {
            // Load additional data
            Promise.all([
                client.getAllergies(),
                client.getMedications('active'),
                client.getConditions()
            ]).then(([allergiesData, medsData, conditionsData]) => {
                setAllergies(allergiesData);
                setMedications(medsData);
                setConditions(conditionsData);
            }).catch(console.error);
        }
    }, [isAuthenticated, patient, client]);
    
    if (loading) {
        return <div>Loading...</div>;
    }
    
    if (error) {
        return <div>Error: {error.message}</div>;
    }
    
    if (!isAuthenticated) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <h1>Kaiser Permanente Health Records</h1>
                <button onClick={login} style={{ padding: '10px 20px', fontSize: '16px' }}>
                    Login with Kaiser Permanente
                </button>
            </div>
        );
    }
    
    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>My Health Records</h1>
                <button onClick={logout}>Logout</button>
            </div>
            
            {patient && (
                <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                    <h2>Patient Information</h2>
                    <p><strong>Name:</strong> {patient.name?.[0]?.given?.join(' ')} {patient.name?.[0]?.family}</p>
                    <p><strong>Birth Date:</strong> {patient.birthDate}</p>
                    <p><strong>Gender:</strong> {patient.gender}</p>
                </div>
            )}
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <h3>Allergies</h3>
                    {allergies?.entry?.length > 0 ? (
                        <ul>
                            {allergies.entry.map(entry => (
                                <li key={entry.resource.id}>
                                    {entry.resource.code?.text || 'Unknown'}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No allergies on record</p>
                    )}
                </div>
                
                <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <h3>Active Medications</h3>
                    {medications?.entry?.length > 0 ? (
                        <ul>
                            {medications.entry.map(entry => (
                                <li key={entry.resource.id}>
                                    {entry.resource.medicationCodeableConcept?.text || 'Unknown'}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No active medications</p>
                    )}
                </div>
                
                <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <h3>Conditions</h3>
                    {conditions?.entry?.length > 0 ? (
                        <ul>
                            {conditions.entry.slice(0, 5).map(entry => (
                                <li key={entry.resource.id}>
                                    {entry.resource.code?.text || 'Unknown'}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No conditions on record</p>
                    )}
                </div>
            </div>
        </div>
    );
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        KaiserPermanenteFHIRClient,
        useKaiserPermanenteFHIR,
        KaiserPermanenteApp,
        KP_CONFIG
    };
}
