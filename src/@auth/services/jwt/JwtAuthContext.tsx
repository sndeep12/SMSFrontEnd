import { FuseAuthProviderState } from '@fuse/core/FuseAuthProvider/types/FuseAuthTypes';
import { User } from '@auth/user';
import { createContext } from 'react';
import { JwtSignInPayload } from '@auth/services/jwt/JwtAuthProvider';

export type JwtAuthContextType = FuseAuthProviderState<User> & {
	updateUser: (U: User) => Promise<Response>;
	signIn?: (credentials: JwtSignInPayload) => Promise<{ user: User; token: string } | null>;
	signOut?: () => void;
	refreshToken?: () => Promise<string | Response>;
};

const defaultAuthContext: JwtAuthContextType = {
	authStatus: 'configuring',
	isAuthenticated: false,
	user: null,
	updateUser: null,
	signIn: null,
	signOut: null,
	refreshToken: null
};

const JwtAuthContext = createContext<JwtAuthContextType>(defaultAuthContext);

export default JwtAuthContext;
