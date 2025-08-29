import Typography from '@mui/material/Typography';


function SignInPageTitle() {
	return (
		<div className="w-full">
			<img
				className="w-12"
				src="/assets/images/logo/logo.svg"
				alt="logo"
			/>

			<Typography className="mt-8 text-4xl leading-[1.25] font-extrabold tracking-tight">Sign in</Typography>
		</div>
	);
}

export default SignInPageTitle;
