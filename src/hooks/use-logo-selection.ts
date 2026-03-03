import { useCallback } from "react";
import { deriveNameFromLogo } from "@/lib/logo";

interface UseLogoSelectionProps {
    mode: "create" | "update";
    currentLogo: string;
    currentName: string;
    onUpdate: (updates: { logo: string; name?: string }) => void;
}

/**
 * Hook for handling logo selection with automatic name derivation.
 * When a logo is selected, updates the name field if creating or if current name is empty/matches derived.
 */
export function useLogoSelection({
    mode,
    currentLogo,
    currentName,
    onUpdate,
}: UseLogoSelectionProps) {
    return useCallback(
        (newLogo: string) => {
            const derived = deriveNameFromLogo(newLogo);
            const previousDerived = deriveNameFromLogo(currentLogo);

            const shouldUpdateName =
                mode === "create" ||
                currentName.trim().length === 0 ||
                previousDerived === currentName.trim();

            if (shouldUpdateName) {
                onUpdate({ logo: newLogo, name: derived });
            } else {
                onUpdate({ logo: newLogo });
            }
        },
        [mode, currentLogo, currentName, onUpdate],
    );
}
