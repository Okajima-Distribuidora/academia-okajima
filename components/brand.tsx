import Image from "next/image";
import Link from "next/link";
import logo from "@/public/logo.png";
import lightLogo from "@/public/logo-light.png";

export function Brand() {
  return <Link href="/" aria-label="Academia Okajima — início"
    className="relative block h-10 w-32 shrink-0 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring sm:w-36">
    <Image src={logo} alt="" fill sizes="(max-width: 640px) 128px, 144px"
      className="object-contain object-left dark:hidden" priority />
    <Image src={lightLogo} alt="" fill sizes="(max-width: 640px) 128px, 144px"
      className="hidden object-contain object-left dark:block" />
  </Link>;
}
