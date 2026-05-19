import { Wallet, LayoutGrid, BookOpen, CreditCard, BarChart3 } from 'lucide-react';
import ModuleLandingPage from '@/components/shared/ModuleLandingPage';
import { APP_PATHS } from '@/lib/paths';

export default function FinanceModulePage() {
  return (
    <ModuleLandingPage
      title="Finance"
      description="Maintain your general ledger, track payments, and generate financial reports."
      icon={Wallet}
      modules={[
        {
          title: 'Chart of Accounts',
          description: 'General ledger account structure',
          path: APP_PATHS.finance.accounts.list(),
          icon: LayoutGrid,
          actionLabel: 'View Accounts',
        },
        {
          title: 'Journal Entries',
          description: 'General ledger transactions and audits',
          path: APP_PATHS.finance.journalEntries.list(),
          icon: BookOpen,
          actionLabel: 'Review Journal',
        },
        {
          title: 'Payments',
          description: 'Accounts receivable and payable transactions',
          path: APP_PATHS.finance.payments.list(),
          icon: CreditCard,
          actionLabel: 'Manage Cash',
        },
        {
          title: 'Reports',
          description: 'Financial statements (PnL, Balance Sheet)',
          path: APP_PATHS.finance.reports.pnl(),
          icon: BarChart3,
          actionLabel: 'View Statements',
        },
      ]}
    />
  );
}
