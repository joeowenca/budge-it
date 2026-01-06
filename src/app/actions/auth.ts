"use server";

import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const emailSchema = z.string().email("Invalid email address");

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one capital letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().optional(),
});

export async function login(formData: FormData) {
  const rawFormData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  // Validate input
  const validationResult = loginSchema.safeParse(rawFormData);
  if (!validationResult.success) {
    return {
      error: validationResult.error.issues[0]?.message || "Invalid input",
    };
  }

  const { email, password } = validationResult.data;

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const rawFormData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    name: formData.get("name") as string | undefined,
  };

  // Validate input
  const validationResult = signupSchema.safeParse(rawFormData);
  if (!validationResult.success) {
    return {
      error: validationResult.error.issues[0]?.message || "Invalid input",
    };
  }

  const { email, password, name } = validationResult.data;

  const supabase = await createClient();

  // Sign up the user with Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name || email.split("@")[0],
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.user) {
    return { error: "Failed to create user" };
  }

  // Insert user into our public users table
  try {
    await db.insert(users).values({
      authId: data.user.id,
      email: email,
      name: name || email.split("@")[0],
      currency: "USD",
      theme: "system",
    });
  } catch (dbError) {
    // If user already exists, that's okay - they might be signing up again
    console.error("Error inserting user into database:", dbError);
    // Continue anyway as the auth user was created
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/sign-in");
}

