import { useState } from 'react';
import { fmtMoney } from '../../../public/js/format.js';
import { Icon } from '../components/Icon.jsx';
import { useBills } from '../hooks/useBills.js';
import { BillRow } from '../components/billsense/BillRow.jsx';
import { CategoryBars } from '../components/billsense/CategoryBars.jsx';
import { OverdueCard } from '../components/billsense/OverdueCard.jsx';
import { AiInsightsCard } from '../components/billsense/AiInsightsCard.jsx';
import { openBillFormModal } from '../components/billsense/BillFormModal.jsx';

// React port of public/js/pages/billsense.js's mount()/renderAll(). Same
// data shape, same two-call load (GET /api/bills + GET /api/bills/stats),
// same card layout. See PHASE_4_BILLSENSE_MIGRATION_REPORT.md for the full
// parity matrix and the one shared-modal.js bugfix this page's delete flow
// required.
export function BillSense({ ctx }) {
  const { api, toast, state } = ctx;
  const { bills, stats, overdue, loading, error, refetch } = useBills(api);
  const [insights, setInsights] = useState(null);

  async function handleMarkPaid(billId) {
    try {
      await api.post(`/api/bills/${billId}/pay`, {});
      toast('Marked as paid', 'success');
      refetch();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  function openAdd() {
    openBillFormModal({ api, toast, existing: null, onSaved: refetch });
  }
  function openEdit(bill) {
    openBillFormModal({ api, toast, existing: bill, onSaved: refetch });
  }

  async function loadInsights() {
    if (!state.aiConfigured) {
      setInsights({ unavailable: true });
      return;
    }
    setInsights({ loading: true });
    try {
      const result = await api.post('/api/bills/insights', {});
      if (!result.ok) {
        setInsights({ error: result.error });
        return;
      }
      setInsights({ data: result.data });
    } catch (err) {
      setInsights({ error: err.message });
    }
  }

  // Matches the original's own loading text exactly — full-page spinner on
  // first mount, before renderAll() has ever completed once.
  if (loading) {
    return (
      <div className="page">
        <div className="loading-line">
          <span className="spinner" /> Loading BillSense…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="empty-state">
          <Icon name="alert" cls="icon-lg" />
          <h3>Couldn&apos;t load this page</h3>
          <p>{error.message}</p>
          {/* Visual Redesign Batch 3: retry action, wired to the existing
              refetch() this page's own data hook already exposes — no new
              data-fetching logic. This whole-page error state (covering the
              stat row too, not just the bill list) is unchanged structurally
              from before this batch: BillSense fetches bills+stats together
              via one Promise.all, so a single failure genuinely means the
              whole page failed, unlike Tasks' error, which is scoped to its
              one list. Preserved rather than forced to match Tasks. */}
          <button className="btn" style={{ marginTop: 'var(--sp-2)' }} onClick={refetch}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">BillSense</h1>
          <p className="page-subtitle">Understand and stay ahead of recurring expenses.</p>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={loadInsights}>
            <Icon name="sparkle" cls="icon-sm" /> AI insights
          </button>
          <button className="btn btn-primary" onClick={openAdd}>
            <Icon name="plus" cls="icon-sm" /> Add bill
          </button>
        </div>
      </div>

      <div className="stat-row">
        <div className="card card-pad stat-tile">
          <div className="stat-value">{fmtMoney(stats.monthlyTotal)}</div>
          <div className="stat-label">Monthly total</div>
        </div>
        {/* What "Mark as paid" has actually recorded this month. Replaces the
            "Tracked bills" count (now in the list heading below): paying a
            bill used to change no number on this page at all. */}
        <div className="card card-pad stat-tile">
          <div className="stat-value">
            {stats.paidThisMonth?.length
              ? stats.paidThisMonth.map((p) => fmtMoney(p.total, p.currency)).join(' + ')
              : fmtMoney(0)}
          </div>
          <div className="stat-label">
            Paid this month
            {stats.paidThisMonthCount ? ` · ${stats.paidThisMonthCount} ${stats.paidThisMonthCount === 1 ? 'payment' : 'payments'}` : ''}
          </div>
        </div>
        <div className="card card-pad stat-tile">
          <div className="stat-value">{stats.overdueCount}</div>
          <div className="stat-label">Overdue</div>
        </div>
        <div className="card card-pad stat-tile">
          <div className="stat-value">{stats.upcomingCount}</div>
          <div className="stat-label">Due in 14 days</div>
        </div>
      </div>

      <AiInsightsCard state={insights} />

      <div className="dash-grid">
        {/* Visual Redesign Batch 3: the recurring-bill list is a continuum
            being scanned, not a set of separate comparable things (unlike
            the two cards it sits beside — "By category" and "Overdue
            bills" are genuine summary facts and correctly keep .card
            treatment, unchanged, per the spec's set-vs-continuum rule) —
            so it uses the same shared .list-region primitive Batch 2
            proved on Tasks, not a second, page-specific wrapper class.
            module-accent--money is BillSense's one approved module accent
            (spec §9/§22): it tints this region's heading text and, via
            .bill-cat-icon's ambient --_accent-* lookup, each row's icon —
            nothing else on the page. The heading text itself ("All
            bills") is unchanged from the .card-header/.card-title it
            replaces, just re-typeset in the section-label role instead of
            the generic card-title style. */}
        <div className="list-region module-accent--money">
          <div className="list-region-heading">All bills{bills.length ? ` (${bills.length})` : ''}</div>
          {bills.length ? (
            <div className="row-list">
              {bills.map((b) => (
                <BillRow key={b.id} bill={b} onEdit={openEdit} onMarkPaid={handleMarkPaid} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Icon name="bill" cls="icon-lg" />
              <h3>No bills yet</h3>
              <p>Add your first recurring bill to start understanding your monthly obligations.</p>
            </div>
          )}
        </div>
        <div className="stack">
          <div className="card card-pad">
            <div className="card-header">
              <span className="card-title">By category</span>
            </div>
            <CategoryBars byCategory={stats.byCategory} />
          </div>
          {overdue.length ? <OverdueCard bills={overdue} /> : null}
        </div>
      </div>
    </div>
  );
}
