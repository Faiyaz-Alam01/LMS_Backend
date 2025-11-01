import {Router} from "express"
import { addLectureToCourseById, createCourse, deleteLecture, getAllCourses, getCourseLectures, removeCourse, updateCourse } from "../controllers/course.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/verifyJWT.js";
import { authorizedRoles } from "../middleware/auth.middleware.js";

const router = Router();

router.route('/getAllCourses').get(getAllCourses)
router.route('/create').post(verifyJWT,authorizedRoles("ADMIN"),upload.single('avatar'),createCourse);

router.route('/update/:id').put(verifyJWT, authorizedRoles("ADMIN"),updateCourse);
router.route('/:id').delete(verifyJWT,authorizedRoles("ADMIN"),removeCourse);


router.route('/addLecture/:id').post(verifyJWT,authorizedRoles('ADMIN'),upload.single('lecture') ,addLectureToCourseById)
router.route('/deleteLecture/:courseId/:lectureId').delete(deleteLecture)
router.route('/get-lectures/:id').get(getCourseLectures)



export default router