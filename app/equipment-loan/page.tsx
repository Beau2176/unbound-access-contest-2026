import AccessApp from "../../components/access-app";
import { secondForm } from "../../lib/forms";

export default function EquipmentLoan() {
  return <AccessApp key={secondForm.id} initialForm={secondForm} storageKey="unbound-access-session-equipment-loan-v1" />;
}
