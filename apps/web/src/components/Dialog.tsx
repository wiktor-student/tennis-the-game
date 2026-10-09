import { useEffect, useId, useRef, type ReactNode } from 'react';

interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Native modal <dialog> opened with showModal(): focus trapping, Esc / platform close
 * requests and the top layer come from the browser.
 */
export function Dialog({ open, title, onClose, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog ref={ref} className="dialog" aria-labelledby={titleId} onClose={onClose}>
      <div className="dialog__body stack">
        <h2 id={titleId} className="display" style={{ fontSize: '1.6rem' }}>
          {title}
        </h2>
        {children}
      </div>
    </dialog>
  );
}

interface ConfirmProps {
  open: boolean;
  title: string;
  text: string;
  confirmLabel: string;
  cancelLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog(p: ConfirmProps) {
  return (
    <Dialog open={p.open} title={p.title} onClose={p.onCancel}>
      <p className="muted">{p.text}</p>
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <button className="btn btn--ghost" onClick={p.onCancel}>
          {p.cancelLabel}
        </button>
        <button className={`btn ${p.danger ? 'btn--danger' : 'btn--primary'}`} onClick={p.onConfirm}>
          {p.confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
