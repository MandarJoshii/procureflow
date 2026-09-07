import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/db";
import { env } from "../../config/env";
import type { SignupInput, LoginInput } from "./auth.schema";

const SALT_ROUNDS = 10;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function signToken(payload: { userId: string; organizationId: string; role: string }) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export async function signup(input: SignupInput) {
  const existingUser = await prisma.user.findFirst({
    where: { email: input.email },
  });

  if (existingUser) {
    throw new Error("EMAIL_ALREADY_EXISTS");
  }

  const baseSlug = slugify(input.organizationName);
  let slug = baseSlug;
  let suffix = 1;

  // ensure slug uniqueness in case two orgs pick similar names
  while (await prisma.organization.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix}`;
    suffix++;
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const result = await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: {
        name: input.organizationName,
        slug,
      },
    });

    const user = await tx.user.create({
      data: {
        organizationId: organization.id,
        email: input.email,
        passwordHash,
        role: "SUPER_ADMIN", // first user of a new org is the admin
      },
    });

    return { organization, user };
  });

  const token = signToken({
    userId: result.user.id,
    organizationId: result.organization.id,
    role: result.user.role,
  });

  return {
    token,
    user: {
      id: result.user.id,
      email: result.user.email,
      role: result.user.role,
    },
    organization: {
      id: result.organization.id,
      name: result.organization.name,
      slug: result.organization.slug,
    },
  };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findFirst({
    where: { email: input.email },
    include: { organization: true },
  });

  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);

  if (!passwordMatches) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const token = signToken({
    userId: user.id,
    organizationId: user.organizationId,
    role: user.role,
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    organization: {
      id: user.organization.id,
      name: user.organization.name,
      slug: user.organization.slug,
    },
  };
}