export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f7f5] px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div
            aria-hidden="true"
            className="mx-auto mb-3 grid size-11 place-items-center rounded-2xl bg-[#252520] text-white shadow-lg"
          >
            ✦
          </div>
          <p className="text-sm font-semibold tracking-[-0.01em] text-[#22221f]">
            Magica Agent Chat
          </p>
        </div>
        <div className="flex justify-center">{children}</div>
      </div>
    </main>
  );
}
