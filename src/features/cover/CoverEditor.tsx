import { CoverSidebar } from './components/CoverSidebar';
import { CoverPreview } from './components/CoverPreview';

export function CoverEditor() {
    return (
        <div className="flex h-full w-full overflow-hidden">
            <CoverSidebar />
            <CoverPreview />
        </div>
    );
}
