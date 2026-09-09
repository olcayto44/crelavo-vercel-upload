import Header from "./Header";
import Footer from "./Footer";

export default function CreamShell({
  children,
  footer = true,
  compactFooter = false,
}: {
  children: React.ReactNode;
  footer?: boolean;
  compactFooter?: boolean;
}) {
  return (
    <div className="cl-root">
      <Header />
      {children}
      {footer ? <Footer compact={compactFooter} /> : null}
    </div>
  );
}
