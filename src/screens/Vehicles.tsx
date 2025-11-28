import { useState, useEffect } from 'react';
import { ArrowLeft, Car, Plus, Trash2, Edit2 } from 'lucide-react';
import { useApp, Vehicle } from '../context/AppContext';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';

export default function Vehicles() {
  const { navigateTo, vehicles, addVehicle, updateVehicle, deleteVehicle, userRole } = useApp();
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [seatingLimit, setSeatingLimit] = useState('');
  const [vehicleType, setVehicleType] = useState<'2-wheeler' | '3-wheeler' | '4-wheeler'>('4-wheeler');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');



  const resetForm = () => {
    setRegistrationNumber('');
    setSeatingLimit('');
    setVehicleType('4-wheeler');
    setMake('');
    setModel('');
    setColor('');
    setShowAddForm(false);
    setEditingVehicle(null);
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setRegistrationNumber(vehicle.registrationNumber);
    setSeatingLimit(vehicle.seatingLimit.toString());
    setVehicleType(vehicle.vehicleType);
    setMake(vehicle.make || '');
    setModel(vehicle.model || '');
    setColor(vehicle.color || '');
    setShowAddForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!registrationNumber || !seatingLimit || !vehicleType || !make || !model || !color) {
      setError('Please fill in all required fields.');
      return;
    }

    const seatingLimitNum = Number(seatingLimit);
    if (!Number.isFinite(seatingLimitNum) || seatingLimitNum < 1) {
      setError('Please enter a valid seating limit (at least 1).');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      if (editingVehicle) {
        await updateVehicle(editingVehicle._id, {
          registrationNumber,
          seatingLimit: seatingLimitNum,
          vehicleType,
          make: make || undefined,
          model: model || undefined,
          color: color || undefined,
        });
      } else {
        await addVehicle({
          registrationNumber,
          seatingLimit: seatingLimitNum,
          vehicleType,
          make: make || undefined,
          model: model || undefined,
          color: color || undefined,
        });
      }

      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save vehicle. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (userRole !== 'driver') {
      navigateTo('dashboard');
    }
  }, [userRole, navigateTo]);

  const handleDelete = async (vehicleId: string) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) {
      return;
    }

    try {
      await deleteVehicle(vehicleId);
    } catch (err) {
      alert('Failed to delete vehicle');
    }
  };

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gray-100 rounded-full translate-x-1/3 -translate-y-1/3 opacity-20"></div>
      </div>

      <button
        onClick={() => navigateTo('dashboard')}
        className="mb-8 flex items-center text-black hover:opacity-70 transition-opacity font-semibold"
      >
        <ArrowLeft size={24} className="mr-2" />
        Back to Dashboard
      </button>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-black">My Vehicles</h1>
            <p className="text-gray-600 font-medium mt-2">Manage your registered vehicles</p>
          </div>
          {!showAddForm && (
            <Button onClick={() => setShowAddForm(true)}>
              <Plus size={20} className="mr-2" />
              Add Vehicle
            </Button>
          )}
        </div>

        {showAddForm && (
          <Card highlight className="mb-8 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-black">
                {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
              </h2>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>

            {error && (
              <div className="mb-4 rounded-2xl border-2 border-red-500 bg-red-50 p-4 text-sm font-semibold text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Registration Number *"
                  placeholder="e.g., DL-01-AB-1234"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  required
                />
                <div>
                  <label className="block text-sm font-semibold mb-2.5 text-black">
                    Vehicle Type *
                  </label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value as '2-wheeler' | '3-wheeler' | '4-wheeler')}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg smooth-transition focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                    required
                  >
                    <option value="2-wheeler">2-wheeler</option>
                    <option value="3-wheeler">3-wheeler</option>
                    <option value="4-wheeler">4-wheeler</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Seating Limit *"
                  type="number"
                  placeholder="e.g., 4"
                  value={seatingLimit}
                  onChange={(e) => setSeatingLimit(e.target.value)}
                  required
                  min="1"
                />
                <Input
                  label="Make *"
                  placeholder="e.g., Toyota, Honda"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Model *"
                  placeholder="e.g., Camry, Civic"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  required
                />
                <Input
                  label="Color *"
                  placeholder="e.g., Red, Blue"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" fullWidth size="lg" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
              </Button>
            </form>
          </Card>
        )}

        {vehicles.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Car size={64} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-bold text-black mb-2">No vehicles added yet</h3>
              <p className="text-gray-600 mb-6">Add your first vehicle to start creating rides</p>
              {!showAddForm && (
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus size={20} className="mr-2" />
                  Add Your First Vehicle
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((vehicle) => (
              <Card key={vehicle._id} className="animate-fade-in">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-black text-white rounded-xl">
                    <Car size={24} />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(vehicle)}
                      className="p-2 text-gray-600 hover:text-black transition-colors"
                      title="Edit vehicle"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(vehicle._id)}
                      className="p-2 text-red-600 hover:text-red-700 transition-colors"
                      title="Delete vehicle"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-black mb-2">{vehicle.registrationNumber}</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-semibold">Type:</span> {vehicle.vehicleType}</p>
                  <p><span className="font-semibold">Seating:</span> {vehicle.seatingLimit} seats</p>
                  {vehicle.make && <p><span className="font-semibold">Make:</span> {vehicle.make}</p>}
                  {vehicle.model && <p><span className="font-semibold">Model:</span> {vehicle.model}</p>}
                  {vehicle.color && <p><span className="font-semibold">Color:</span> {vehicle.color}</p>}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

