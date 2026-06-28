import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#0D1B2A] flex items-center justify-center">
      <div className="text-center mb-8 absolute top-8 left-1/2 -translate-x-1/2">
        <span className="text-2xl font-bold text-[#F4A261]">Sthir</span><span className="text-2xl font-bold text-white">Mind</span>
      </div>
      <SignIn
        appearance={{
          elements: {
            rootBox: 'mt-12',
            card: 'bg-[#1A2A3D] border border-white/10 shadow-2xl',
            headerTitle: 'text-white',
            headerSubtitle: 'text-[#8B9BB4]',
            formFieldLabel: 'text-[#8B9BB4]',
            formFieldInput: 'bg-[#243447] border-white/10 text-white',
            footerActionLink: 'text-[#F4A261]',
            formButtonPrimary: 'bg-gradient-to-r from-[#F4A261] to-[#e8834a]',
          },
        }}
      />
    </div>
  );
}
