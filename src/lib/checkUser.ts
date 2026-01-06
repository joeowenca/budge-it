import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const checkUser = async () => {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const loggedInUser = await db.query.users.findFirst({
    where: eq(users.authId, user.id),
  });

  return loggedInUser || null;
};