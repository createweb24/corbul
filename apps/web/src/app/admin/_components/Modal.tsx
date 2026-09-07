"use client";

/**
 * Dialogurile panoului — construite peste `Modal` / `ConfirmModal` din
 * design system-ul comun (A4). Stratul acesta adaugă doar ce are nevoie
 * adminul: un supratitlu auriu deasupra titlului și numele de proprietăți
 * folosite de paginile de administrare (`busy`, `onCancel`).
 *
 * Nicăieri în panou nu se folosesc `alert()`, `confirm()` sau `prompt()`.
 */

import type { ReactNode } from "react";
import {
  ConfirmModal,
  Modal as BaseModal,
  type ModalSize,
} from "@/components/ui/Modal";

export type { ModalSize };

function titleWithKicker(title: ReactNode, kicker?: string): ReactNode {
  if (!kicker) return title;
  return (
    <>
      <span className="kicker mb-1.5 block">{kicker}</span>
      {title}
    </>
  );
}

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  /** text mic, versal, auriu, deasupra titlului */
  kicker?: string;
  description?: ReactNode;
  size?: ModalSize;
  children?: ReactNode;
  footer?: ReactNode;
  /** blochează închiderea cât timp o salvare e în curs */
  busy?: boolean;
}

export function Modal({
  open,
  onClose,
  title,
  kicker,
  description,
  size = "md",
  children,
  footer,
  busy = false,
}: ModalProps) {
  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={titleWithKicker(title, kicker)}
      description={description}
      size={size}
      persistent={busy}
      footer={footer}
    >
      {children}
    </BaseModal>
  );
}

export interface ConfirmDialogProps {
  open: boolean;
  title: ReactNode;
  kicker?: string;
  /** consecința acțiunii, într-o frază */
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "gold";
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Singurul înlocuitor al lui `confirm()` din panou. */
export function ConfirmDialog({
  open,
  title,
  kicker,
  message,
  confirmLabel = "Confirmă",
  cancelLabel = "Renunță",
  tone = "danger",
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <ConfirmModal
      open={open}
      onClose={onCancel}
      onConfirm={onConfirm}
      title={titleWithKicker(title, kicker)}
      message={message}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      tone={tone}
      loading={busy}
    />
  );
}
