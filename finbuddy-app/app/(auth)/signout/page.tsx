"use client";

import { useEffect } from "react";
import { redirect } from "next/navigation";

export default function SignOut() {

  useEffect(() => {
    const signOutUser = async () => {
      const res = await fetch("/api/signout", { method: "GET" });
      const data = await res.json();
      console.log(data);

      if (!data.isSession) {
        console.log("TEST");
        redirect("/");
      } else {
        alert("Failed to sign out");
      }
    };

    signOutUser();
  }, [redirect]);

  return (
    <div>
      <p>Signing you out...</p>
    </div>
  );
}
