import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';

const deviceInput = z.object({
  deviceId:  z.string(),
  os:        z.string(),
  platform:  z.enum(['desktop','mobile','web']),
  endpoint:  z.url(),
  token:     z.string().optional(),
  userAgent: z.string().optional(),
});

const deviceResponse = z.object({
  id:         z.string(),
  deviceId:   z.string(),
  os:         z.string(),
  platform:   z.enum(['desktop','mobile','web']),
  endpoint:   z.string(),
  token:      z.string().nullable(),
  userAgent:  z.string().nullable(),
  lastSeenAt: z.string(),
  createdAt:  z.string(),
});

const signupHumanSchema = z.object({
  userType:    z.literal('HUMAN'),
  email:       z.email(),
  password:    z.string().min(8),
  name:        z.string().optional(),
  phoneNumber: z.string().optional(),
  device:      deviceInput.optional(),
});

const signupServiceSchema = z.object({
  userType:    z.literal('SERVICE'),
  email:       z.email(),
  name:        z.string().optional(),
  phoneNumber: z.string().optional(),
  device:      deviceInput.optional(),
});

const signupSchema = z.discriminatedUnion('userType', [
  signupHumanSchema,
  signupServiceSchema,
]);

const userResponse = z.object({
  id:           z.string(),
  email:        z.email(),
  userType:     z.enum(['HUMAN','SERVICE']),
  name:         z.string().nullable(),
  phoneNumber:  z.string().nullable(),
  createdAt:    z.string(),
  devices:      z.array(deviceResponse),
});

type SignupBody = z.infer<typeof signupSchema>;

type UserResponse = z.infer<typeof userResponse>;

const usersRoute: FastifyPluginAsync = async (app) => {
  app.post(
    '/users',
    {
      schema: {
        summary:     'Sign up a new user or service account with optional device',
        description: 'Creates a human user (requires password) or a service account, \
                      optionally registering a device for push notifications.',
        body:        signupSchema,
        response:    { 201: userResponse },
      },
    },
    async (request, reply) => {
      const body = signupSchema.parse(request.body) as SignupBody;

      let hashedPassword: string | undefined;
      if (body.userType === 'HUMAN') {
        hashedPassword = await bcrypt.hash(body.password, 10);
      }

      const devicesData = body.device
        ? {
            create: {
              deviceId:   body.device.deviceId,
              os:         body.device.os,
              platform:   body.device.platform,
              endpoint:   body.device.endpoint,
              token:      body.device.token,
              userAgent:  body.device.userAgent,
              lastSeenAt: new Date(),
            },
          }
        : undefined;

      try {
        const user = await app.prisma.user.create({
          data: {
            email:       body.email,
            userType:    body.userType,
            name:        body.name,
            phoneNumber: body.phoneNumber,
            ...(hashedPassword && { hashedPassword }),
            devices:     devicesData,
          },
          include: { devices: true },
        });

        const result: UserResponse = {
          id:          user.id,
          email:       user.email,
          userType:    user.userType,
          name:        user.name ?? null,
          phoneNumber: user.phoneNumber ?? null,
          createdAt:   user.createdAt.toISOString(),
          devices:     user.devices.map(d => ({
            id:         d.id,
            deviceId:   d.deviceId,
            os:         d.os,
            platform:   d.platform as 'desktop' | 'mobile' | 'web',
            endpoint:   d.endpoint,
            token:      d.token ?? null,
            userAgent:  d.userAgent ?? null,
            lastSeenAt: d.lastSeenAt.toISOString(),
            createdAt:  d.createdAt.toISOString(),
          })),
        };

        return reply.code(201).send(result);
      } catch (err: unknown) {
        // Handle duplicate email error
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002' &&
          (err.meta as any)?.target?.includes('email')
        ) {
          return reply
            .code(409)
            .send({ message: 'A user with that email already exists.' });
        }
        throw err;
      }
    }
  );
};

export default usersRoute;
