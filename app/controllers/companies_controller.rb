class CompaniesController < ApplicationController

  before_action :load_company_and_authorize, only: [:show, :edit, :update, :destroy, :activate, :deactivate]


  def index
    @company = Company.new
    @collection = Company.all
  end

  def show
  end

  def create
    @company = Company.new
    @company.user = current_user
    @company.assign_attributes(company_params)

    if @company.save
      flash[:success] = I18n.t('actions.success.created', resource: t('activerecord.models.company'))
      redirect_to companies_path
    else
      redirect_to companies_path
    end
  end

  def edit
  end

  def update
    @company.assign_attributes(company_params)

    if @company.save
      flash[:success] = I18n.t('actions.success.updated', resource: t('activerecord.models.company'))
      redirect_to companies_path
    else
      render :edit
    end
  end

  def destroy
    if @company.destroy
      flash[:success] = I18n.t('actions.success.destroyed', resource: t('activerecord.models.company'))
      redirect_to companies_path
    else
      redirect_to companies_path
    end
  end


  private

  def company_params
    allowed_parameters = [:name]
    allowed_parameters << :subdomain if current_user.has_role?(:superadmin)
    params.require(:company).permit(allowed_parameters)
  end


  def load_company_and_authorize
    @company = Company.find_by_id(params[:id])
    return redirect_to companies_path if @company.nil?
=begin
    unless @company.authorized?(current_user)
      return head(:forbidden)
    end
=end
  end

  def current_company
    return nil unless params[:id]
    @company
  end
end