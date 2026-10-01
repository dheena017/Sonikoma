/**
 * Deprecated: StudioCustomSelect is superseded by the shared CyberSelect component.
 * Re-exporting CyberSelect to maintain compatibility without code duplication.
 */
import CyberSelect, {
  CyberSelectOption,
  CyberSelectProps,
} from "@/shared/ui/common/CyberSelect";

export type {
  CyberSelectOption as StudioCustomSelectOption,
  CyberSelectProps as StudioCustomSelectProps,
};
export const StudioCustomSelect = CyberSelect;
export default CyberSelect;
