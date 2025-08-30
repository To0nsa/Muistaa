import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import zxcvbn from 'zxcvbn';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { passwordPolicy } from '../../utils/validation/passwordPolicy.js';

const signupSchema = z
  .object({
    email: z.email(),
    password: passwordPolicy(),
    nickName: z.string().min(1),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    countryCode: z.string().optional(),
    phoneNumber: z.string().optional(),
  })
  .refine(
    (data) => {
      // If phoneNumber is present, countryCode must be present
      return !data.phoneNumber || !!data.countryCode;
    },
    {
      message: 'countryCode is required when phoneNumber is provided',
      path: ['countryCode'], // highlights the countryCode field
    }
  );

const signupResponse = z.object({
  id: z.string(),
  email: z.string(),
  nickName: z.string(),
  phoneNumber: z.string().nullable(),
  createdAt: z.string(),
});

const weakPasswordResponse = z.object({
  message: z.literal('Password is too weak'),
  feedback: z.object({
    warning: z.string().optional(),
    suggestions: z.array(z.string()),
  }),
});

const signupRoute: FastifyPluginAsync = async (app) => {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/signup',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Register a new user',
        description: 'Creates a new user account with email and password.',
        body: signupSchema,
        response: {
          201: signupResponse,
          400: weakPasswordResponse,
          409: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const { email, password, nickName, phoneNumber } = request.body;

      try {
        const hashedPw = await bcrypt.hash(password, 10);

        const user = await app.prisma.user.create({
          data: {
            email,
            password: hashedPw,
            nickName,
            phoneNumber,
          },
        });

        return reply.code(201).send({
          id: user.id,
          email: user.email,
          nickName: user.nickName ?? '',
          phoneNumber: user.phoneNumber ?? null,
          createdAt: user.createdAt.toISOString(),
        });
      } catch (err: any) {
        if (err.code === 'P2002' && err.meta?.target?.includes('email')) {
          return reply.code(409).send({ message: 'Email already in use.' });
        }
        throw err;
      }
    }
  );
};

export default signupRoute;
