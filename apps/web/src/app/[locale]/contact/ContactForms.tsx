"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { FormEvent } from "react";
import { Button, Field, useToast } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import type { MessageKind, OkDto } from "@/lib/types";

/**
 * Cele două canale de scriere către redacție:
 *   • formularul de contact obișnuit (nume, e-mail, subiect, mesaj)
 *   • caseta de ponturi — fără câmpuri de identitate obligatorii
 *
 * Amândouă trimit la `POST /api/messages`, cu `kind` diferit. Confirmarea
 * apare și în pagină (accesibil, `role="status"`) și ca notificare Toast;
 * nu se folosește niciodată `alert()`.
 */

type Status = "idle" | "sending" | "sent" | "error";

interface MessagePayload {
  kind: MessageKind;
  name?: string;
  email?: string;
  subject?: string;
  body: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_BODY = 10;

async function sendMessage(payload: MessagePayload): Promise<void> {
  await apiFetch<OkDto>("/messages", { method: "POST", body: payload });
}

function StatusLine({
  status,
  okText,
  errorText,
}: {
  status: Status;
  okText: string;
  errorText: string;
}) {
  if (status === "sent") {
    return (
      <p
        role="status"
        className="mt-5 border-l-2 border-sage bg-sage/10 px-4 py-3 font-sans text-sm text-sage"
      >
        {okText}
      </p>
    );
  }
  if (status === "error") {
    return (
      <p
        role="alert"
        className="mt-5 border-l-2 border-ember bg-ember/10 px-4 py-3 font-sans text-sm text-ember"
      >
        {errorText}
      </p>
    );
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Formularul de contact                                               */
/* ------------------------------------------------------------------ */

export function ContactForm() {
  const t = useTranslations();
  const { success, error: toastError } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<{ email?: string; body?: string }>({});

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: { email?: string; body?: string } = {};
    if (!EMAIL_RE.test(email.trim())) next.email = t("errors.form.email");
    if (body.trim().length < MIN_BODY) {
      next.body = t("errors.form.minLength", { count: MIN_BODY });
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setStatus("sending");
    try {
      await sendMessage({
        kind: "contact",
        name: name.trim() || undefined,
        email: email.trim(),
        subject: subject.trim() || undefined,
        body: body.trim(),
      });
      setStatus("sent");
      setName("");
      setEmail("");
      setSubject("");
      setBody("");
      success(t("contact.form.success"));
    } catch {
      setStatus("error");
      toastError(t("contact.form.error"));
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label={t("contact.form.name")}
          name="name"
          value={name}
          placeholder={t("contact.form.namePlaceholder")}
          autoComplete="name"
          onValueChange={setName}
        />
        <Field
          label={t("contact.form.email")}
          name="email"
          type="email"
          required
          value={email}
          error={errors.email}
          placeholder={t("contact.form.emailPlaceholder")}
          autoComplete="email"
          onValueChange={setEmail}
        />
      </div>

      <Field
        label={t("contact.form.subject")}
        name="subject"
        value={subject}
        placeholder={t("contact.form.subjectPlaceholder")}
        onValueChange={setSubject}
      />

      <Field
        as="textarea"
        rows={7}
        label={t("contact.form.message")}
        name="body"
        required
        value={body}
        error={errors.body}
        placeholder={t("contact.form.messagePlaceholder")}
        onValueChange={setBody}
      />

      <div className="pt-1">
        <Button
          variant="gold"
          type="submit"
          loading={status === "sending"}
          disabled={status === "sending"}
        >
          {status === "sending" ? t("contact.form.sending") : t("contact.form.send")}
        </Button>
      </div>

      <StatusLine
        status={status}
        okText={t("contact.form.success")}
        errorText={t("contact.form.error")}
      />
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Pontul securizat                                                    */
/* ------------------------------------------------------------------ */

export function TipForm() {
  const t = useTranslations();
  const { success, error: toastError } = useToast();

  const [body, setBody] = useState("");
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | undefined>();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (body.trim().length < MIN_BODY) {
      setError(t("errors.form.minLength", { count: MIN_BODY }));
      return;
    }
    setError(undefined);
    setStatus("sending");
    try {
      // fără nume și fără e-mail: identitatea sursei nu se cere niciodată
      await sendMessage({
        kind: "tip",
        subject: reply.trim() || undefined,
        body: body.trim(),
      });
      setStatus("sent");
      setBody("");
      setReply("");
      success(t("contact.tip.success"));
    } catch {
      setStatus("error");
      toastError(t("contact.tip.error"));
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <Field
        as="textarea"
        rows={6}
        label={t("common.message")}
        name="tip"
        required
        value={body}
        error={error}
        placeholder={t("contact.tip.placeholder")}
        onValueChange={setBody}
      />

      <Field
        label={t("contact.tip.contactOptional")}
        name="reply"
        value={reply}
        autoComplete="off"
        onValueChange={setReply}
      />

      <div className="pt-1">
        <Button
          variant="gold"
          type="submit"
          loading={status === "sending"}
          disabled={status === "sending"}
        >
          {status === "sending" ? t("contact.tip.sending") : t("contact.tip.send")}
        </Button>
      </div>

      <StatusLine
        status={status}
        okText={t("contact.tip.success")}
        errorText={t("contact.tip.error")}
      />
    </form>
  );
}
