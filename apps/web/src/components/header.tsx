"use client";
import Link from "next/link";
import { ModeToggle } from "./mode-toggle";

export default function Header() {
	const links = [
		{ to: "/", label: "Home" },
		{ to: "/detail", label: "Tender Detail" }
	] as const;

	return (
		<div>
			<div className="flex flex-row items-center justify-between px-4 py-3">
				<nav className="flex gap-4 text-lg">
					{links.map(({ to, label }) => {
						return (
							<Link 
								key={to} 
								href={to}
								className="text-gray-700 hover:text-gray-900"
							>
								{label}
							</Link>
						);
					})}
				</nav>
				<div className="flex items-center gap-2">
					<ModeToggle />
				</div>
			</div>
			<hr className="border-gray-200" />
		</div>
	);
}