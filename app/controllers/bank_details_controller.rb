class BankDetailsController < DashboardController

  before_action :load_bank_detail, only: [:edit, :show, :update, :destroy]

  def index
    @collection = BankDetail.templates.by_service(current_service)
  end

  def new
    @current_bank_detail = BankDetail.new
    @form_values = get_form_values
  end

  def create
    @current_bank_detail = BankDetail.new
    @current_bank_detail.user = current_user
    @current_bank_detail.service = current_service
    @current_bank_detail.assign_attributes(bank_detail_params)
    if @current_bank_detail.save
      flash[:success] = I18n.t('actions.success.created', resource: t('activerecord.models.bank_detail'))
      redirect_to_show
    else
      @form_values = get_form_values
      render :new
    end
  end

  def show
  end

  def edit
    @form_values = get_form_values
  end

  def update
    @current_bank_detail.assign_attributes(bank_detail_params)
    if @current_bank_detail.save
      flash[:success] = I18n.t('actions.success.updated', resource: t('activerecord.models.bank_detail'))
      redirect_to_show
    else
      @form_values = get_form_values
      render :edit
    end
  end

  def destroy
    if @current_bank_detail.destroy
      flash[:success] = I18n.t('actions.success.destroyed', resource: t('activerecord.models.bank_detail'))
      redirect_to_index
    else
      flash[:error] = I18n.t('errors.an_error_occured',resource: t('activerecord.models.bank_detail') )
      render :show
    end
  end

  private

  def get_form_values
    return [current_service, current_bank_detail]
  end

  def redirect_to_index
    return redirect_to service_bank_details_path(current_service)
  end

  def redirect_to_show
    return redirect_to service_bank_detail_path(current_service, current_bank_detail)
  end

  def load_bank_detail
    @current_bank_detail = BankDetail.find(params[:id])
  end

  def current_bank_detail
    @current_bank_detail
  end

  def bank_detail_params
    allowed_parameters = [:name, :bank_name, :account_owner, :bic, :iban]
    return params.require(:bank_detail).permit(allowed_parameters)
  end

end
