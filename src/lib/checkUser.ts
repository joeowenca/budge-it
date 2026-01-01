import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const checkUser = async () => {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  const loggedInUser = await db.query.users.findFirst({
    where: eq(users.clerkId, user.id),
  });

  if (loggedInUser) {
    return loggedInUser;
  }

  const newUser = await db
    .insert(users)
    .values({
      clerkId: user.id,
      name: `${user.firstName} ${user.lastName}`,
      imageUrl: user.imageUrl,
      email: user.emailAddresses[0].emailAddress,
    })
    .returning();

  return newUser[0];
};