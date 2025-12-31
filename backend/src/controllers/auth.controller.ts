import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import prisma from '../utils/prisma';
import { hashPassword, comparePassword } from '../utils/bcrypt';
import { generateToken } from '../utils/jwt';
import { getFileUrl } from '../utils/fileUpload';

export const registerB2C = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { full_name, email, mobile, password, account_type } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { mobile }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User with this email or mobile already exists'
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        fullName: full_name,
        email,
        mobile,
        passwordHash,
        accountType: account_type || 'b2c'
      }
    });

    res.status(201).json({
      status: 'success',
      message: 'B2C registration successful',
      user_id: user.id,
      account_type: user.accountType,
      verification_required: true
    });
  } catch (error: any) {
    console.error('B2C Registration Error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Registration failed'
    });
  }
};

export const registerB2B = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      business_name,
      business_type,
      gst_number,
      pan_number,
      registration_number,
      contact_person,
      business_address,
      email,
      password
    } = req.body;

    // Check if GST number already exists
    const existingBusiness = await prisma.b2BBusiness.findUnique({
      where: { gstNumber: gst_number }
    });

    if (existingBusiness) {
      return res.status(400).json({
        status: 'error',
        message: 'Business with this GST number already exists'
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User with this email already exists'
      });
    }

    // Process uploaded files
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const documents: any = {};

    if (files.gst_certificate?.[0]) {
      documents.gst_certificate = getFileUrl(files.gst_certificate[0].filename);
    }
    if (files.business_license?.[0]) {
      documents.business_license = getFileUrl(files.business_license[0].filename);
    }
    if (files.pan_card?.[0]) {
      documents.pan_card = getFileUrl(files.pan_card[0].filename);
    }
    if (files.address_proof?.[0]) {
      documents.address_proof = getFileUrl(files.address_proof[0].filename);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user and business
    const user = await prisma.user.create({
      data: {
        fullName: contact_person.name,
        email,
        mobile: contact_person.mobile,
        passwordHash,
        accountType: 'b2b',
        b2bBusiness: {
          create: {
            businessName: business_name,
            businessType: business_type,
            gstNumber: gst_number,
            panNumber: pan_number,
            registrationNumber: registration_number || null,
            contactPerson: contact_person,
            businessAddress: business_address,
            documents
          }
        }
      },
      include: {
        b2bBusiness: true
      }
    });

    res.status(201).json({
      status: 'success',
      message: 'B2B registration submitted. Pending admin approval.',
      business_id: user.b2bBusiness?.id,
      account_status: user.b2bBusiness?.accountStatus
    });
  } catch (error: any) {
    console.error('B2B Registration Error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Registration failed'
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { identifier, password } = req.body;

    // Find user by email or mobile
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { mobile: identifier }
        ]
      },
      include: {
        b2bBusiness: true
      }
    });

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (user.status !== 'active') {
      return res.status(403).json({
        status: 'error',
        message: 'Account is inactive'
      });
    }

    // For B2B users, check if account is approved
    if (user.accountType === 'b2b') {
      if (!user.b2bBusiness) {
        return res.status(403).json({
          status: 'error',
          message: 'Business account not found'
        });
      }

      if (user.b2bBusiness.accountStatus !== 'approved') {
        return res.status(403).json({
          status: 'error',
          message: `Business account is ${user.b2bBusiness.accountStatus}. Please wait for admin approval.`
        });
      }
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      accountType: user.accountType,
      businessId: user.b2bBusiness?.id
    });

    // Prepare user response
    const userResponse: any = {
      user_id: user.id,
      name: user.fullName,
      email: user.email,
      account_type: user.accountType
    };

    if (user.accountType === 'b2b' && user.b2bBusiness) {
      userResponse.business_id = user.b2bBusiness.id;
      userResponse.business_name = user.b2bBusiness.businessName;
      userResponse.business_status = user.b2bBusiness.accountStatus;
      userResponse.credit_available = user.b2bBusiness.availableCredit.toNumber();
    }

    res.json({
      status: 'success',
      token,
      user: userResponse
    });
  } catch (error: any) {
    console.error('Login Error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Login failed'
    });
  }
};

