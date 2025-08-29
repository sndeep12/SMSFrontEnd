import FuseUtils from '@fuse/utils';
import Base64 from 'crypto-js/enc-base64';
import HmacSHA256 from 'crypto-js/hmac-sha256';
import Utf8 from 'crypto-js/enc-utf8';
import jwtDecode from 'jwt-decode';
import { PartialDeep } from 'type-fest';
import UserModel from '@auth/user/models/UserModel';
import { User } from '@auth/user';
import { http, HttpResponse } from 'msw';
import mockApi from '../mockApi';

type UserAuthType = User & { password: string };

const authApi = [
	http.post('/api/mock/auth/refresh', async ({ request }) => {
		const newTokenResponse = await generateAccessToken(request);

		if (newTokenResponse) {
			const { token } = newTokenResponse;

			return HttpResponse.json(null, { status: 200, headers: { 'New-Access-Token': token } });
		}

		const error = 'Invalid access token detected or user not found';

		return HttpResponse.json({ error }, { status: 401 });
	}),

	

	http.get('/api/mock/auth/user/:id', async ({ params }) => {
		const api = mockApi('users');
		const { id } = params as Record<string, string>;
		const item = await api.find(id);

		if (!item) {
			return HttpResponse.json({ message: 'User not found' }, { status: 404 });
		}

		return HttpResponse.json(item);
	}),

	http.get('/api/mock/auth/user-by-email/:email', async ({ params }) => {
		const api = mockApi('users');
		const { email } = params as Record<string, string>;
		const item = await api.find({ email });

		if (!item) {
			return HttpResponse.json({ message: 'User not found' }, { status: 404 });
		}

		return HttpResponse.json(item);
	}),

	http.put('/api/mock/auth/user/:id', async ({ params, request }) => {
		const api = mockApi('users');
		const { id } = params as Record<string, string>;

		const data = (await request.json()) as { user: PartialDeep<UserAuthType> };

		const updatedUser = await api.update(id, data);

		delete (updatedUser as Partial<UserAuthType>).password;

		return HttpResponse.json(updatedUser);
	})
];

export default authApi;

/**
 * JWT Token Generator/Verifier Helpers
 * !! Created for Demonstration Purposes, cannot be used for PRODUCTION
 */

const jwtSecret = 'some-secret-code-goes-here';

/* eslint-disable */

function base64url(source: CryptoJS.lib.WordArray) {
	// Encode in classical base64
	let encodedSource = Base64.stringify(source);

	// Remove padding equal characters
	encodedSource = encodedSource.replace(/=+$/, '');

	// Replace characters according to base64url specifications
	encodedSource = encodedSource.replace(/\+/g, '-');
	encodedSource = encodedSource.replace(/\//g, '_');

	// Return the base64 encoded string
	return encodedSource;
}

function generateJWTToken(tokenPayload: { [key:string]: unknown } ) {
	// Define token header
	const header = {
		alg: 'HS256',
		typ: 'JWT'
	};

	// Calculate the issued at and expiration dates
	const date = new Date();
	const iat = Math.floor(date.getTime() / 1000);
	const exp = Math.floor(date.setDate(date.getDate() + 7) / 1000);

	// Define token payload
	const payload: unknown = {
		iat,
		iss: 'Fuse',
		exp,
		...tokenPayload
	};

	// Stringify and encode the header
	const stringifiedHeader = Utf8.parse(JSON.stringify(header));
	const encodedHeader = base64url(stringifiedHeader);

	// Stringify and encode the payload
	const stringifiedPayload = Utf8.parse(JSON.stringify(payload));
	const encodedPayload = base64url(stringifiedPayload);

	// Sign the encoded header and mock-api
	let signature = `${encodedHeader}.${encodedPayload}`;
	// @ts-ignore
	signature = HmacSHA256(signature, jwtSecret);
	// @ts-ignore
	signature = base64url(signature);

	// Build and return the token
	return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function verifyJWTToken(token: string) {
	// Split the token into parts
	const parts = token.split('.');
	const header = parts[0];
	const payload = parts[1];
	const signature = parts[2];

	// Re-sign and encode the header and payload using the secret
	const signatureCheck = base64url(HmacSHA256(`${header}.${payload}`, jwtSecret));

	// Verify that the resulting signature is valid
	return signature === signatureCheck;
}

/**
 * Generate Access Token
 */
async function generateAccessToken(request: Request): Promise<{ token: string; user: User } | null> {
	const authHeader = request.headers.get('Authorization') as string;

	if (!authHeader) {
		return null;
	}

	const [scheme, token] = authHeader.split(' ');

	if (scheme !== 'Bearer' || !token) {
		return null;
	}

	if (verifyJWTToken(token)) {
		const { id }: { id: string } = jwtDecode(token);

		const user = await mockApi('users').find(id) as User | undefined;

		if (user) {
			delete user.password;
			const token = generateJWTToken({ id: user.id });
			return { token, user };
		}
	}

	return null;
}
