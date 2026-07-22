import { useState } from "react";
import { motion } from "framer-motion";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "../firebase/index.js";
import { useAuth } from "../context/AuthContext.jsx";

const CustomOrder = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    fullName: "",
    mobileNumber: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pinCode: "",
    productType: "",
    quantity: "1",
    description: "",
    stlFileLink: "",
    referenceImageLink: "",
    additionalMessage: "",
    namePlateText: "",
    licensePlateNumber: "",
    photoFrameDriveLink: "",
    contactViaWhatsApp: false,
    whatsappNumber: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submittedOrderId, setSubmittedOrderId] = useState("");

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = "Mobile number is required";
    } else if (!/^[0-9]{10}$/.test(formData.mobileNumber)) {
      newErrors.mobileNumber = "Mobile number must be 10 digits";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.state.trim()) newErrors.state = "State is required";
    if (!formData.pinCode.trim()) {
      newErrors.pinCode = "Pin code is required";
    } else if (!/^[0-9]{6}$/.test(formData.pinCode)) {
      newErrors.pinCode = "Pin code must be 6 digits";
    }
    if (!formData.productType)
      newErrors.productType = "Product type is required";
    if (!formData.quantity || formData.quantity < 1)
      newErrors.quantity = "Quantity must be at least 1";
    if (!formData.description.trim())
      newErrors.description = "Description is required";

    if (formData.productType === "Name Plate" && !formData.namePlateText.trim()) {
      newErrors.namePlateText = "Name is required for name plate";
    }
    if (
      formData.productType === "License Plate" &&
      !formData.licensePlateNumber.trim()
    ) {
      newErrors.licensePlateNumber = "License number is required for license plate";
    }
    if (
      formData.productType === "Photo Frame" &&
      !formData.photoFrameDriveLink.trim()
    ) {
      newErrors.photoFrameDriveLink =
        "Google Drive photo link is required for photo frame";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const db = getFirestore();
      const orderId =
        "CUST-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();

      await addDoc(collection(db, "customOrders"), {
        ...formData,
        quantity: parseInt(formData.quantity),
        status: "pending",
        orderId,
        createdAt: serverTimestamp(),
      });

      setSubmittedOrderId(orderId);
      setSuccess(true);
    } catch (error) {
      console.error("Error submitting custom order:", error);
      setErrors({ submit: "Failed to submit order. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field) =>
    `w-full px-4 py-3 rounded-lg border ${
      errors[field]
        ? "border-red-600 focus:border-red-600 focus:ring-red-600"
        : "border-gray-300 dark:border-gray-300 focus:border-orange-500 focus:ring-orange-500"
    } bg-white dark:bg-gray-50 text-gray-900 dark:text-gray-900 focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all`;

  const showNamePlateField = formData.productType === "Name Plate";
  const showLicensePlateField = formData.productType === "License Plate";
  const showPhotoFrameField = formData.productType === "Photo Frame";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-900 mb-4">
            Custom{" "}
            <span className="text-gray-900 dark:text-gray-900 font-bold">
              Order
            </span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-900 max-w-2xl mx-auto">
            Have a unique idea? Share your requirements and we'll bring it to
            life with precision 3D printing
          </p>
        </motion.div>

        {success && !submittedOrderId && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-green-100 dark:bg-green-900/30 border border-green-400 text-green-700 dark:text-green-300 rounded-lg text-center"
          >
            Your custom order has been submitted successfully!
          </motion.div>
        )}

        {success && submittedOrderId && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-green-100 dark:bg-green-900/30 border-2 border-green-400 rounded-xl"
          >
            <h3 className="text-xl font-bold text-green-800 dark:text-green-300 mb-2">
              ✅ Custom Order Submitted Successfully!
            </h3>
            <p className="text-green-700 dark:text-green-300">
              Your Order ID: <strong>{submittedOrderId}</strong>
            </p>
            <p className="text-green-700 dark:text-green-300 mt-2">
              The Aira3D team will contact you within <strong>24 hours</strong> via WhatsApp or Email to confirm your order details and payment.
            </p>
          </motion.div>
        )}

        {!success && !authLoading && !currentUser && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-50 rounded-2xl shadow-xl p-8 md:p-10 text-center"
          >
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
            <p className="text-gray-600 mb-6">Please login to submit a custom order.</p>
            <a href="/login" className="inline-block px-8 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold">Go to Login</a>
          </motion.div>
        )}

        {!success && !authLoading && currentUser && (
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-50 rounded-2xl shadow-xl p-8 md:p-10 space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-900 mb-2">
                Full Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className={inputClass("fullName")}
                placeholder="Enter your full name"
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-900 mb-2">
                Mobile Number <span className="text-red-600">*</span>
              </label>
              <input
                type="tel"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleChange}
                pattern="[0-9]{10}"
                className={inputClass("mobileNumber")}
                placeholder="10-digit mobile number"
              />
              {errors.mobileNumber && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.mobileNumber}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-900 mb-2">
                Email <span className="text-red-600">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={inputClass("email")}
                placeholder="your@email.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-900 mb-2">
                Product Type <span className="text-red-600">*</span>
              </label>
              <select
                name="productType"
                value={formData.productType}
                onChange={handleChange}
                className={inputClass("productType")}
              >
                <option value="">Select product type</option>
                <option value="Name Plate">🏷️ Name Plate</option>
                <option value="License Plate">🚗 License Plate</option>
                <option value="Photo Frame">🖼️ Photo Frame</option>
                <option value="Home Decor">🏠 Home Decor</option>
                <option value="Ganesh Model">🕉️ Ganesh Model</option>
                <option value="Other">📦 Other</option>
              </select>
              {errors.productType && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.productType}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-900 mb-2">
                Quantity <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="1"
                className={inputClass("quantity")}
              />
              {errors.quantity && (
                <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-900 mb-2">
                City <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className={inputClass("city")}
                placeholder="Your city"
              />
              {errors.city && (
                <p className="mt-1 text-sm text-red-600">{errors.city}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-900 mb-2">
                State <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className={inputClass("state")}
                placeholder="Your state"
              />
              {errors.state && (
                <p className="mt-1 text-sm text-red-600">{errors.state}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-900 mb-2">
                Pin Code <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="pinCode"
                value={formData.pinCode}
                onChange={handleChange}
                pattern="[0-9]{6}"
                className={inputClass("pinCode")}
                placeholder="6-digit pin code"
              />
              {errors.pinCode && (
                <p className="mt-1 text-sm text-red-600">{errors.pinCode}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-900 mb-2">
              Complete Address <span className="text-red-600">*</span>
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows="3"
              className={inputClass("address")}
              placeholder="Enter your complete address"
            />
            {errors.address && (
              <p className="mt-1 text-sm text-red-600">{errors.address}</p>
            )}
          </div>

          {showNamePlateField && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-900 mb-4">
                🏷️ Name Plate Details
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-900 mb-2">
                  Name to Print <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="namePlateText"
                  value={formData.namePlateText}
                  onChange={handleChange}
                  className={inputClass("namePlateText")}
                  placeholder="Enter the name to be printed on the name plate"
                />
                {errors.namePlateText && (
                  <p className="mt-1 text-sm text-red-600">{errors.namePlateText}</p>
                )}
              </div>
            </motion.div>
          )}

          {showLicensePlateField && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-900 mb-4">
                🚗 License Plate Details
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-900 mb-2">
                  License Plate Number <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="licensePlateNumber"
                  value={formData.licensePlateNumber}
                  onChange={handleChange}
                  className={inputClass("licensePlateNumber")}
                  placeholder="e.g., MH 12 DS 3454"
                />
                {errors.licensePlateNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.licensePlateNumber}</p>
                )}
                <p className="mt-1 text-xs text-gray-400">
                  Enter your vehicle registration number (e.g., MH 56 DS 3454)
                </p>
              </div>
            </motion.div>
          )}

          {showPhotoFrameField && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-900 mb-4">
                🖼️ Photo Frame Details
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-900 mb-2">
                  Google Drive Photo Link <span className="text-red-600">*</span>
                </label>
                <input
                  type="url"
                  name="photoFrameDriveLink"
                  value={formData.photoFrameDriveLink}
                  onChange={handleChange}
                  className={inputClass("photoFrameDriveLink")}
                  placeholder="https://drive.google.com/file/d/..."
                />
                {errors.photoFrameDriveLink && (
                  <p className="mt-1 text-sm text-red-600">{errors.photoFrameDriveLink}</p>
                )}
                <p className="mt-1 text-xs text-gray-400">
                  Upload your photo to Google Drive and paste the shareable link here. Make sure the link is set to "Anyone with the link can view".
                </p>
              </div>
            </motion.div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-900 mb-2">
              Description <span className="text-red-600">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className={inputClass("description")}
              placeholder="Describe your product requirements in detail"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-900 mb-2">
              Additional Message{" "}
              <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              name="additionalMessage"
              value={formData.additionalMessage}
              onChange={handleChange}
              rows="3"
              className={inputClass("additionalMessage")}
              placeholder="Any additional instructions or requests"
            />
          </div>

          {!showPhotoFrameField && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-900 mb-2">
                  STL File Link{" "}
                  <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="url"
                  name="stlFileLink"
                  value={formData.stlFileLink}
                  onChange={handleChange}
                  className={inputClass("stlFileLink")}
                  placeholder="https://drive.google.com/file/d/..."
                />
                <p className="mt-1 text-xs text-gray-400">
                  Share your STL file via Google Drive, Dropbox, or any link
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-900 mb-2">
                  Reference Image Link{" "}
                  <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="url"
                  name="referenceImageLink"
                  value={formData.referenceImageLink}
                  onChange={handleChange}
                  className={inputClass("referenceImageLink")}
                  placeholder="https://drive.google.com/file/d/..."
                />
                <p className="mt-1 text-xs text-gray-400">
                  Share a reference image via Google Drive or any link
                </p>
              </div>
            </div>
          )}

          {errors.submit && (
            <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-300 rounded-lg text-center">
              {errors.submit}
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-300 text-gray-800 font-semibold rounded-lg shadow-lg hover:shadow-orange-400/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                Submitting...
              </>
            ) : (
              "Submit Custom Order"
            )}
          </motion.button>
        </motion.form>
        )}
      </div>
    </div>
  );
};

export default CustomOrder;
