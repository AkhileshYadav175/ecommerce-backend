import { Request, Response, NextFunction } from 'express';
import { UserService } from '../service/user.service.js';
import { getUsersQuerySchema, updateUserSchema } from '../validation/user.validation.js';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * Fetch paginated list of users.
   */
  getUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parseResult = getUsersQuerySchema.safeParse(req.query);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid query parameters',
            details: parseResult.error.issues.map((issue) => ({
              field: issue.path.join('.'),
              message: issue.message,
            })),
          },
        });
        return;
      }

      const result = await this.userService.getUsers(parseResult.data);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Fetch user details by ID.
   */
  getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const user = await this.userService.getUserById(id);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update details of a user.
   */
  updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const parseResult = updateUserSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            details: parseResult.error.issues.map((issue) => ({
              field: issue.path.join('.'),
              message: issue.message,
            })),
          },
        });
        return;
      }

      const user = await this.userService.updateUser(id, parseResult.data);

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Block a user.
   */
  blockUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      await this.userService.blockUser(id);

      res.status(200).json({
        success: true,
        message: 'User has been blocked successfully. Active sessions revoked.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Unblock a user.
   */
  unblockUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      await this.userService.unblockUser(id);

      res.status(200).json({
        success: true,
        message: 'User has been unblocked successfully.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Soft delete a user.
   */
  softDeleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      await this.userService.softDeleteUser(id);

      res.status(200).json({
        success: true,
        message: 'User has been soft-deleted successfully. Active sessions revoked.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Restore a soft-deleted user.
   */
  restoreUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      await this.userService.restoreUser(id);

      res.status(200).json({
        success: true,
        message: 'User has been restored successfully.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get user management dashboard overview statistics.
   */
  getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.userService.getStats();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };
}
