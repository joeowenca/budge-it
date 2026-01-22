export type AmountPillColorTypes = "blue" | "green" | "red" | "yellow" | "gray" | undefined;

interface AmountPillProps {
    amount: string,
    color: AmountPillColorTypes,
    className?: string
}

export function AmountPill({ amount, color, className }: AmountPillProps) {
    const colors: Record<string, string> = {
        blue: "text-primary bg-primary/10",
        green: "text-green-700 bg-green-500/10",
        red: "text-red-600 bg-red-500/10",
        yellow: "text-yellow-800 bg-yellow-500/15",
        gray: "text-gray-800 bg-gray-600/10"
    };

    const colorClasses = color && colors[color] ? colors[color] : colors.gray;

    return (
        <span className={`font-medium text-sm tracking-wider px-2.5 py-1 ${colorClasses} rounded-full ${className}`}>
            {amount}
        </span>
    );
}