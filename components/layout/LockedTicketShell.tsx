interface Props {
  children: React.ReactNode;
}

export function LockedTicketShell({ children }: Props) {
  return (
    <div className="relative min-h-screen">
      <div className="relative z-10">{children}</div>
    </div>
  );
}
