"use client";

import { useSearchParams } from "next/navigation";
// importá acá tu LoginForm / UI actual si lo tenés separado
// import LoginForm from "./LoginForm";

export default function LoginClient() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <>
      {/* Ejemplo: mostrás error si lo usabas */}
      {error ? (
        <div style={{ marginBottom: 12, color: "crimson" }}>
          Error: {error}
        </div>
      ) : null}

      {/* Pegá acá el contenido actual del login (form, layout, etc.) */}
      {/* <LoginForm /> */}
      <div>TODO: mover acá el contenido del login</div>
    </>
  );
}