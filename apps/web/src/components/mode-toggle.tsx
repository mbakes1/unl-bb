"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

export function ModeToggle() {
	return (
		<Button variant="outline" size="icon" disabled>
			<span className="sr-only">Light mode only</span>
		</Button>
	);
}