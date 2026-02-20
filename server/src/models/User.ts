import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
    username: string;
    email: string;
    password: string;
    passwordHash: string;
    bio: string;
    avatar: string;
    followers: mongoose.Types.ObjectId[];
    following: mongoose.Types.ObjectId[];
    createdAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
    {
        username: { 
            type: String,
            required: true,
            unique: true,
            trim: true,
            minlength: 3,
            maxlength: 30,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },

        passwordHash: {
            type: String,
            requred: true,
        },

        bio: {
            type: String,
            default: '',
            maxlength: 160,
        },

        avatar: {
            type: String,
            default: '',
        },

        followers: [
            {
                type: mongoose.Types.ObjectId,
                ref: 'User',
            }
        ],
        following: [
            {
                type: mongoose.Types.ObjectId,
                ref: 'User',
            }
        ]
    },
    {
        timestamps: true,

    }
)

export default mongoose.model<IUser>('User', UserSchema);