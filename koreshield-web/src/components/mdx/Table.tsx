
export function Table({ children }: { children: React.ReactNode }) {
    return (
        <div className="overflow-x-auto my-8 border border-slate-800 rounded-lg">
            <table className="min-w-full divide-y divide-slate-800">
                {children}
            </table>
        </div>
    );
}

export const components = {
    table: Table,
};
