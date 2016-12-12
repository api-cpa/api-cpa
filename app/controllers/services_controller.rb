class ServicesController < ApplicationController
  before_action :authenticate_user!
  before_action :load_service_and_authorize, only: [:show, :edit, :update, :destroy]

  def index
    @collection = Service.authorized(current_user)
  end

  def show
  end

  def new
    @service = Service.new
  end

  def create
    @service = Service.new
    @service.user = current_user
    @service.assign_attributes(service_params)

    if @service.save
      flash[:success] = I18n.t('actions.success.created', resource: t('activerecord.models.service'))
      redirect_to service_path(@service)
    else
      flash[:error] = @service.errors.messages
    end
  end

  def edit
  end

  def update
    @service.assign_attributes(service_params)

    if @service.save
      flash[:success] = I18n.t('actions.success.updated', resource: t('activerecord.models.service'))
      redirect_to service_path(@service)
    else
      flash[:error] = @service.errors.messages
      render :edit
    end
  end

  def destroy
    if @service.destroy
      flash[:success] = I18n.t('actions.success.destroyed', resource: t('activerecord.models.service'))
      redirect_to services_path
    else
      flash[:error] = @service.errors.messages
      render :show
    end
  end

  def activate
    return head(:forbidden) unless current_user.has_role?(:superadmin)

    if @service = Service.find_by_id(params[:id])
      ActivateServiceJob.perform_later @service.id
      redirect_to service_path(@service)
    end
  end

  def deactivate
    return head(:forbidden) unless current_user.has_role?(:superadmin)

    if @service = Service.find_by_id(params[:id])
      DeactivateServiceJob.perform_later @service.id
      redirect_to service_path(@service)
    end
  end

  private

  def service_params
    params.require(:service).permit(:name, :description)
  end

  def load_service_and_authorize
    @service = Service.find_by_id(params[:id])
    return redirect_to services_path if @service.nil?
    unless @service.authorized?(current_user)
      return head(:forbidden)
    end
  end
end