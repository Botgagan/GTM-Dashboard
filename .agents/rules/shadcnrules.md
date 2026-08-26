# Shadcn UI Rules

Always prioritize using **Shadcn UI components** (`@/components/ui/*`) for any user interface elements in this project. 
Do not duplicate standard HTML/CSS for elements where a Shadcn component exists.

- **Tables:** Use `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, and `TableCell`.
- **Modals:** Use `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle` (No custom popup/modal HTML).
- **Icons:** Use `lucide-react` for all icons (e.g., `Users`, `Calendar`, `Send`, `CheckCircle`).
- **Inputs & Buttons:** Use Shadcn `Button`, `Input`, `Select`, `DropdownMenu`.
- **Styling:** Use Tailwind utility classes via `cn()` if custom tweaking is absolutely necessary, but rely on the base component variants as much as possible.

- **Consistency & Dimensions:** Always ensure consistent sizing across the entire application. When adding a new Table, Dialog, or Panel, look at existing implementations and mirror their exact dimensions.
    - Example: Use `<DialogContent className="sm:max-w-[90vw] w-[90vw] h-[85vh] sm:max-h-[85vh] flex flex-col p-6">` for full-screen modals.
    - Example: Use `min-w-[1200px]` for internal tables to match horizontal scroll behavior.
    - Always match font sizes, font weights, and icon sizes (e.g. `w-4 h-4`) identically to other tabs. Do not reinvent dimensions for new features.