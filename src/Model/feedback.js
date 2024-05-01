import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        unique: true,
        required: true,
    },
    message: {
        type: String,
        required: true,
        
    },
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

async function addFeedback(name, email, message) {
    try {
        const newFeedback = new Feedback({ name, email, message });
        await newFeedback.save();
        console.log("Feedback added successfully");
        return { success: true, message: 'Feedback added successfully' };
    } catch (error) {
        console.log(error);
        return { success: false, message: 'Failed to add feedback' };
    }
}


async function getAllFeedbacks() {
    try {
        const allFeedbacks = await Feedback.find();
        return allFeedbacks;
    } catch (error) {
        console.error(error);
        return [];
    }
}


async function deleteFeedback(id) {
    try {
        await Feedback.findByIdAndDelete(id);

        console.log("Feedback deleted successfully");
        return { success: true, message: 'Feedback deleted successfully' };
    } catch (error) {
        console.log(error);
        return { success: false, message: 'Failed to delete feedback' };
    }
}

export {addFeedback}
export { getAllFeedbacks }
export { deleteFeedback }