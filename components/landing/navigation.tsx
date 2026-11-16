import Image from "next/image";
export function Navigation() {
  return <header className="mv-header mv-shell"><a href="/" aria-label="More Vendors home" className="mv-brand"><Image src="/images/brand/logo-ad.png" width={40} height={40} alt="" priority /><span>More Vendors</span></a></header>;
}
