import { InstitutionSelector } from './InstitutionSelector';
import { RadiusSlider } from './RadiusSlider';
import { RuleEnginePanel } from './RuleEnginePanel';
import { CoverageReport } from './CoverageReport';

export function Sidebar() {
  return (
    <div className="flex flex-col gap-6 p-4">
      <InstitutionSelector />
      <RadiusSlider />
      <RuleEnginePanel />
      <CoverageReport />
      <div className="h-4" />
    </div>
  );
}