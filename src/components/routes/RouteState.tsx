type RouteStateProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function RouteState({ title, description, action }: RouteStateProps) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f7f5] px-5 text-[#22221f]">
      <div className="max-w-md text-center" role="status">
        <div
          aria-hidden="true"
          className="mx-auto mb-4 grid size-11 place-items-center rounded-2xl bg-[#252520] text-white shadow-lg"
        >
          ✦
        </div>
        <h1 className="text-xl font-semibold tracking-[-0.02em]">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-black/50">{description}</p>
        {action ? (
          <div className="mt-5 flex justify-center">{action}</div>
        ) : null}
      </div>
    </main>
  );
}
