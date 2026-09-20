import Link from 'next/link';
import Logo from '@/components/logo';

export default function Navbar() {
  return (
    <div className="pointer-events-auto">
      <header className="mx-auto flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-6">
          <Link href="/" aria-label="FAISTOF — home" className="group inline-flex items-center gap-2.5">
            <Logo />
          </Link>
        </div>
      </header>
    </div>
  );
}
