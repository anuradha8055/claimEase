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
import type { WorkflowHistoryResponse, DDOSanctionedClaimResponse } from '../types/index';

export interface EmployeeProfileResponse {
    user_id: string;
    fullName: string;
    emailAddress: string;
    employeeId: string;
    department?: string | null;
    designation?: string | null;
    contactNo?: string | null;
    lastLogin?: string | null;
    panNumber?: string | null;
    bankAccount?: string | null;
    ifscCode?: string | null;
    gradePay?: number | null;
    basicPay?: number | null;
    dateOfJoining?: string | null;
    officeLocation?: string | null;
}

export interface EmployeeProfileUpdatePayload {
    fullName?: string;
    contactNo?: string;
    department?: string;
    designation?: string;
    panNumber?: string;
    bankAccount?: string;
    ifscCode?: string;
    gradePay?: number;
    basicPay?: number;
    dateOfJoining?: string;
    officeLocation?: string;
}


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

export const getClaimDocuments = async (claimId: string): Promise<DocumentResponse[]> => {
    try {
        const { data } = await api.get<DocumentResponse[]>(`/documents/claim/${claimId}`);
        return data;
    } catch (error) {
        console.error('Error fetching documents:', error);
        throw error;
    }
};

export const getDocumentViewUrl = async (documentId: string): Promise<{ url: string; expires_in: number; file_name: string }> => {
    try {
        const { data } = await api.get(`/documents/view/${documentId}`);
        return data;
    } catch (error) {
        console.error('Error generating document view URL:', error);
        throw error;
    }
};

export const getMyQueries = async (): Promise<QueryResponse[]> => {
    try {
        const { data } = await api.get<QueryResponse[]>('/queries/my');
        return data;
    } catch (error) {
        console.error('Error fetching employee queries:', error);
        throw error;
    }
};

export const getEmployeeProfile = async (): Promise<EmployeeProfileResponse> => {
    const { data } = await api.get<EmployeeProfileResponse>('/auth/employee-profile');
    return data;
};

export const updateEmployeeProfile = async (
    profileData: EmployeeProfileUpdatePayload
): Promise<EmployeeProfileResponse> => {
    const { data } = await api.put<EmployeeProfileResponse>('/auth/employee-profile', profileData);
    return data;
};

export const respondToQuery = async (queryId: string, responseText: string): Promise<QueryResponse> => {
    try {
        const { data } = await api.post<QueryResponse>(`/queries/${queryId}/respond`, {
            response_text: responseText,
        });
        return data;
    } catch (error) {
        console.error('Error responding to query:', error);
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

const getOfficerPrefix = (role: UserRole) => {
    switch (role) {
        case 'SCRUTINY_OFFICER':
            return 'scrutiny';
        case 'MEDICAL_OFFICER':
            return 'medical';
        case 'FINANCE_OFFICER':
            return 'finance';
        case 'DDO':
            return 'ddo';
        default:
            throw new Error('Unsupported role for officer endpoints');
    }
};

export const getOfficerQueue = async (role: UserRole): Promise<ClaimResponse[]> => {
    const prefix = getOfficerPrefix(role);
    const { data } = await api.get<ClaimResponse[]>(`/${prefix}/queue`);
    return data;
};

export const getOfficerClaimDetails = async (claimId: string): Promise<ClaimResponse> => {
    const { data } = await api.get<ClaimResponse>(`/claims/${claimId}`);
    return data;
};

export const getClaimWorkflowHistory = async (claimId: string): Promise<WorkflowHistoryResponse[]> => {
    const { data } = await api.get<WorkflowHistoryResponse[]>(`/claims/${claimId}/workflow-history`);
    return data;
};

export const getDDOSanctionedClaims = async (): Promise<DDOSanctionedClaimResponse[]> => {
    const { data } = await api.get<DDOSanctionedClaimResponse[]>('/ddo/sanctioned');
    return data;
};

