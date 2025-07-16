import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { groupsAPI, Group } from '../../../shared/utils/api';
import toast from 'react-hot-toast';

interface EditGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  group: Group;
}

interface FormData {
  name: string;
  description: string;
  visibility: string;
}

const EditGroupModal: React.FC<EditGroupModalProps> = ({ isOpen, onClose, onSuccess, group }) => {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>();

  useEffect(() => {
    if (isOpen && group) {
      setValue('name', group.name);
      setValue('description', group.description || '');
      setValue('visibility', group.visibility || 'private');
    }
  }, [isOpen, group, setValue]);

  const onSubmit = async (data: FormData) => {
    try {
      await groupsAPI.updateGroup(group.id, {
        name: data.name,
        description: data.description,
        visibility: data.visibility,
      });
      reset();
      toast.success('Group updated successfully!');
      onSuccess();
    } catch (error: any) {
      console.error('Failed to update group:', error);
      toast.error(error.userMessage || 'Failed to update group');
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Transition.Root show={isOpen}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    onClick={handleClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                      Edit Group
                    </Dialog.Title>
                    <div className="mt-4">
                      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                          <label htmlFor="name" className="form-label">
                            Group Name
                          </label>
                          <input
                            type="text"
                            {...register('name', { required: 'Group name is required' })}
                            className="form-input"
                            placeholder="Enter group name"
                          />
                          {errors.name && (
                            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="description" className="form-label">
                            Description (Optional)
                          </label>
                          <textarea
                            {...register('description')}
                            rows={3}
                            className="form-input"
                            placeholder="Enter group description"
                          />
                        </div>

                        <div>
                          <label htmlFor="visibility" className="form-label">
                            Group Visibility
                          </label>
                          <select
                            {...register('visibility')}
                            className="form-input"
                          >
                            <option value="private">Private - Invitation only</option>
                            <option value="public">Public - Anyone can request to join</option>
                          </select>
                          <p className="mt-1 text-sm text-gray-500">
                            Public groups can be discovered and joined by anyone with the link.
                          </p>
                        </div>

                        <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex w-full justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 sm:col-start-2 disabled:opacity-50"
                          >
                            {isSubmitting ? 'Updating...' : 'Update Group'}
                          </button>
                          <button
                            type="button"
                            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                            onClick={handleClose}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default EditGroupModal;