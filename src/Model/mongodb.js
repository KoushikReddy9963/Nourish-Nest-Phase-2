import mongoose from "mongoose";
import bcrypt from "bcryptjs";


const NourishuserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  role: {
    default: "user",
    type: String,
  },
  password: {
    type: String,
    required: true,
  },
});

const Nourishuser = mongoose.model('Nourishuser', NourishuserSchema);

async function signUp(Firstname, Lastname, email, password) {
  try {
    const existingNourishuser = await Nourishuser.findOne({ email });
    if (existingNourishuser) {
      return { success: false, message: 'Email already exists' };
    }

    const hashedPassword = await bcrypt.hash(password, 10); 
    const newNourishuser = new Nourishuser({ name: Firstname + " " + Lastname, email, password: hashedPassword });
    await newNourishuser.save();
    
    return { success: true, message: Firstname };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function logIn(email, password) {
  try {
    const existingNourishuser = await Nourishuser.findOne({ email });

    if (!existingNourishuser) {
      return { success: false, message: "Invalid email/User doesn't exist" };
    }
    const isPasswordCorrect = await bcrypt.compare(password, existingNourishuser.password);
    if (isPasswordCorrect) {
      const fname = existingNourishuser.name.split(" ")[0];
      return { success: true, message: fname };
    } else {
      return { success: false, message: "Invalid password" };
    }
  } catch (error) {
    console.error("An error occurred while logging in:", error);
    return { success: false, message: "An error occurred while logging in" };
  }
}


const getAdmin = async (req, res) => {
  const userId = req.user.email;
};
async function getNourishusers() {
  const nourishusers = await Nourishuser.find();
  return nourishusers;
}

async function deleteUser(id) {
  try {
    const result = await Nourishuser.deleteOne({ _id: id });
    if (result.deletedCount > 0) {
      return { success: true };

    } else {
      return { success: false, message: 'User not found or already deleted' };
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, message: 'Error deleting user' };
  }
}

export { signUp, logIn, getNourishusers, deleteUser, getAdmin };
