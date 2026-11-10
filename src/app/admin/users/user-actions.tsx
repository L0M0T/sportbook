"use client";

import { useActionState } from "react";
import {
  toggleUserBlock,
  updateUserRole,
  type FormState,
} from "@/app/actions/admin";

const initial: FormState = { ok: false };

export function UserActions({
  userId,
  role,
  blocked,
  isSelf,
  canManageRoles,
}: {
  userId: string;
  role: string;
  blocked: boolean;
  isSelf: boolean;
  canManageRoles: boolean;
}) {
  const [roleState, roleAction, rolePending] = useActionState(
    updateUserRole,
    initial,
  );
  const [blockState, blockAction, blockPending] = useActionState(
    toggleUserBlock,
    initial,
  );

  return (
    <div className="flex flex-col items-end gap-1.5">
      {canManageRoles && !isSelf ? (
        <form action={roleAction} className="flex items-center gap-1.5">
          <input type="hidden" name="userId" value={userId} />
          <select
            name="role"
            defaultValue={role}
            className="rounded-lg border border-line bg-bg px-2 py-1 text-xs outline-none focus:border-accent"
          >
            <option value="CLIENT">Клиент</option>
            <option value="MANAGER">Менеджер</option>
            <option value="ADMIN">Админ</option>
          </select>
          <button
            type="submit"
            disabled={rolePending}
            className="rounded-lg border border-line px-2.5 py-1 text-xs text-muted transition hover:text-ink disabled:opacity-50"
          >
            {rolePending ? "…" : "ОК"}
          </button>
        </form>
      ) : (
        <span className="text-xs text-muted">
          {isSelf ? "это вы" : "роль меняет админ"}
        </span>
      )}

      {!isSelf && (
        <form action={blockAction}>
          <input type="hidden" name="userId" value={userId} />
          <button
            type="submit"
            disabled={blockPending}
            className={[
              "rounded-lg border px-2.5 py-1 text-xs transition disabled:opacity-50",
              blocked
                ? "border-accent/40 text-accent hover:border-accent"
                : "border-line text-muted hover:border-danger/60 hover:text-danger",
            ].join(" ")}
          >
            {blockPending
              ? "…"
              : blocked
                ? "Разблокировать"
                : "Заблокировать"}
          </button>
        </form>
      )}

      {roleState.error && (
        <p className="max-w-48 text-right text-xs text-danger">
          {roleState.error}
        </p>
      )}
      {blockState.error && (
        <p className="max-w-48 text-right text-xs text-danger">
          {blockState.error}
        </p>
      )}
      {roleState.message && (
        <p className="max-w-48 text-right text-xs text-accent">
          {roleState.message}
        </p>
      )}
      {blockState.message && (
        <p className="max-w-48 text-right text-xs text-accent">
          {blockState.message}
        </p>
      )}
    </div>
  );
}
