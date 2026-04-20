import toast from 'react-hot-toast';
import api from './axios';
import { data } from 'framer-motion/client';
import type {
    User,
    Employee,
    Hospital,
    Claim,
    ClaimStatus,
    Document,
    Query,
    UserRole,
    Treatment,
    Payment,
    WorkflowLog,
    AuditLog,
    HospitalCheckResponse,
    ClaimResponse,
    CalculationResponse,
    DocumentResponse,
    QueryResponse
} from '../types/index';


export const getEmployeeClaims = async () => {
    const { data } = await api.get<ClaimResponse[]>('/claims/my-claims');
    return data;
};

export const getClaimDetails = async (claimId: string) => {
    const { data } = await api.get<ClaimResponse>(`/claims/${claimId}`);
    return data;
};

export const updateClaim = async (claimId: string, claimData: any) => {
    const { data } = await api.put<ClaimResponse>(`/claims/${claimId}`, claimData);
    return data;
};


export async function login(email: string, password: string) {
    const { data } = await api.post<{ accessToken: string }>('/auth/login', { 
        emailAddress: email, 
        password 
    });
    return data.accessToken;
}

export async function getCurrentUser() {
    const { data } = await api.get<User>('/auth/me');
    return data;
}

export async function register(body: {
    fullName: string;
    department: string;
    profession: string;
    employeeId: string;
    contact: string;
    emailAddress: string;
    role: UserRole;
    password: string;
}) {
    const { data } = await api.post<User>('/auth/register', body);
    return data;
}

export const createClaim = async (claimData: any) => {
    // Note: The prefix in main.py is /claims, so this hits localhost:8000/claims
    const { data } = await api.post<ClaimResponse>('/claims/create_claim', claimData);
    return data;
};

export const submitClaimWorkflow = async (claim_id: string): Promise<ClaimResponse> => {
    const { data } = await api.post<ClaimResponse>(`/claims/${claim_id}/submit`);
    return data;
};



export const checkHospitalEligibility = async (hospitalId: string): Promise<HospitalCheckResponse> => {
    try {
        const response = await api.get(`/hospitals/${hospitalId}/eligibility`);
        return response.data;
    } catch (error) {
        console.error('Error checking hospital eligibility:', error);
        throw error;
    }
};

// in mrs.ts


export const uploadDocument = async (claimId: string, documentType: string, file: File): Promise<DocumentResponse> => {
    try {
        const formData = new FormData();
        formData.append('claim_id', claimId);
        formData.append('documentType', documentType);
        formData.append('file', file);

        const response = await api.post(`/documents/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }
    catch (error) {
        console.error('Error uploading document:', error);
        throw error;
    }
};

export const raiseQuery = async (claimId: number, queryData: Partial<Query>): Promise<QueryResponse> => {
    try {
        const response = await api.post(`/claims/${claimId}/queries`, queryData);
        toast.success('Query raised successfully!');
        return response.data;
    }
    catch (error) {
        console.error('Error raising query:', error);
        throw error;
    }
};

export const calculateReimbursement = async (claimId: number, claimedAmount: number): Promise<CalculationResponse> => {
    try {
        const response = await api.post(`/claims/${claimId}/calculate`, { claimed_amount: claimedAmount });
        return response.data;
    } catch (error) {
        console.error('Error calculating reimbursement:', error);
        throw error;
    }
};

