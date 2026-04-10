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
    QueryResponse} from '../types/index';


export const getEmployeeClaims =async() => {
    const {data} = await api.get<Claim[]>('/employee/claims');
    return data;
};


export async function login(email: string, password: string) {
    const {data} = await api.post<{access_token: string}>('/auth/login', { email, password });
    return data.access_token;
}

export async function register(body: {
    name: string;
    department: string;
    profession: string;
    employeeId: string;
    contact: string;
    email: string;
    role: UserRole;
    password: string;
}) {
    const { data } = await api.post<User>('/auth/register', body);
    return data;
}

export const checkHospitalEligibility = async (hospitalId: string): Promise<HospitalCheckResponse> => {
    try {
        const response = await api.get(`/hospitals/${hospitalId}/eligibility`); 
        return response.data;
    } catch (error) {
        console.error('Error checking hospital eligibility:', error);
        throw error;
    }
};  

export const submitClaim = async (claimData: Partial<Claim>): Promise<ClaimResponse> => {
    try {
        const response = await api.post('/claims', claimData);  
        toast.success('Claim submitted successfully!');
        return response.data;
    } catch (error) {
        console.error('Error submitting claim:', error);
        throw error;
    }
};

export const uploadDocument = async (claimId: number, documentData: FormData): Promise<DocumentResponse> => {
    try {
        const response = await api.post(`/claims/${claimId}/documents`, documentData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        toast.success('Document uploaded successfully!');
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
    catch (error) {        console.error('Error raising query:', error);
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

