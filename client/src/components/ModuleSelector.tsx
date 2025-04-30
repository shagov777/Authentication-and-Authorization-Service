import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ModuleSelectorProps {
  selectedModule: string;
  onChange: (moduleId: string) => void;
}

export default function ModuleSelector({ selectedModule, onChange }: ModuleSelectorProps) {
  return (
    <Select value={selectedModule} onValueChange={onChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select module" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="auth">Authentication & Authorization</SelectItem>
        <SelectItem value="profile">Profile Management</SelectItem>
        <SelectItem value="wallet">Wallet & Transactions</SelectItem>
        <SelectItem value="player">Player Data</SelectItem>
        <SelectItem value="social">Social Features</SelectItem>
        <SelectItem value="security">Security</SelectItem>
        <SelectItem value="support">Customer Support</SelectItem>
        <SelectItem value="analytics">Reporting & Analytics</SelectItem>
        <SelectItem value="affiliate">Affiliate Management</SelectItem>
        <SelectItem value="bonus">Bonus System</SelectItem>
        <SelectItem value="loyalty">Loyalty / VIP</SelectItem>
      </SelectContent>
    </Select>
  );
}
